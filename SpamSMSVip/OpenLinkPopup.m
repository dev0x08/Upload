#import "OpenLinkPopup.h"

@interface OpenLinkPopup ()
@property (nonatomic, copy) NSString *popupTitle;
@property (nonatomic, copy) NSString *popupMessage;
@property (nonatomic, strong) NSURL *URL;
@end

@implementation OpenLinkPopup

- (instancetype)initWithTitle:(NSString *)title message:(NSString *)message URL:(NSURL *)URL {
    self = [super init];
    if (self) {
        _popupTitle = [title copy];
        _popupMessage = [message copy];
        _URL = URL;
        self.modalPresentationStyle = UIModalPresentationOverFullScreen;
    }
    return self;
}

- (void)viewDidLoad {
    [super viewDidLoad];
    self.view.backgroundColor = [UIColor colorWithWhite:0 alpha:0.45];

    UIView *card = [[UIView alloc] init];
    card.translatesAutoresizingMaskIntoConstraints = NO;
    card.backgroundColor = UIColor.systemBackgroundColor;
    card.layer.cornerRadius = 18;
    [self.view addSubview:card];

    UILabel *title = [[UILabel alloc] init];
    title.translatesAutoresizingMaskIntoConstraints = NO;
    title.font = [UIFont boldSystemFontOfSize:20];
    title.text = self.popupTitle;

    UILabel *message = [[UILabel alloc] init];
    message.translatesAutoresizingMaskIntoConstraints = NO;
    message.numberOfLines = 0;
    message.text = self.popupMessage;

    UIButton *linkButton = [UIButton buttonWithType:UIButtonTypeSystem];
    linkButton.translatesAutoresizingMaskIntoConstraints = NO;
    [linkButton setTitle:@"Mở liên kết" forState:UIControlStateNormal];
    [linkButton addTarget:self action:@selector(openURL) forControlEvents:UIControlEventTouchUpInside];

    UIButton *closeButton = [UIButton buttonWithType:UIButtonTypeSystem];
    closeButton.translatesAutoresizingMaskIntoConstraints = NO;
    [closeButton setTitle:@"Đóng" forState:UIControlStateNormal];
    [closeButton addTarget:self action:@selector(closePopup) forControlEvents:UIControlEventTouchUpInside];

    UIStackView *stack = [[UIStackView alloc] initWithArrangedSubviews:@[title, message, linkButton, closeButton]];
    stack.translatesAutoresizingMaskIntoConstraints = NO;
    stack.axis = UILayoutConstraintAxisVertical;
    stack.spacing = 14;
    [card addSubview:stack];

    [NSLayoutConstraint activateConstraints:@[
        [card.centerXAnchor constraintEqualToAnchor:self.view.centerXAnchor],
        [card.centerYAnchor constraintEqualToAnchor:self.view.centerYAnchor],
        [card.widthAnchor constraintLessThanOrEqualToAnchor:self.view.widthAnchor multiplier:0.86],
        [card.widthAnchor constraintEqualToConstant:320],
        [stack.topAnchor constraintEqualToAnchor:card.topAnchor constant:22],
        [stack.leadingAnchor constraintEqualToAnchor:card.leadingAnchor constant:22],
        [stack.trailingAnchor constraintEqualToAnchor:card.trailingAnchor constant:-22],
        [stack.bottomAnchor constraintEqualToAnchor:card.bottomAnchor constant:-22]
    ]];
}

- (void)openURL {
    if (self.URL) [[UIApplication sharedApplication] openURL:self.URL options:@{} completionHandler:nil];
}

- (void)closePopup {
    [self dismissViewControllerAnimated:YES completion:nil];
}
@end
